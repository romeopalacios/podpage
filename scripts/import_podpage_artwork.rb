#!/usr/bin/env ruby

require "cgi"
require "fileutils"
require "json"
require "net/http"
require "rexml/document"
require "uri"

ROOT = File.expand_path("..", __dir__)
SITEMAP = "https://www.podpage.com/uncovered-legacy/sitemap.xml"

def fetch(url, limit = 5, attempts = 3)
  raise "Too many redirects for #{url}" if limit.zero?
  uri = URI(url)
  response = Net::HTTP.get_response(uri)
  return response.body if response.is_a?(Net::HTTPSuccess)
  return fetch(URI.join(url, response["location"]).to_s, limit - 1, attempts) if response.is_a?(Net::HTTPRedirection)
  raise "HTTP #{response.code} for #{url}"
rescue SocketError, IOError, Net::OpenTimeout, Net::ReadTimeout
  raise if attempts <= 1
  sleep 1
  fetch(url, limit, attempts - 1)
end

episodes_path = File.join(ROOT, "data", "episodes.json")
data = JSON.parse(File.read(episodes_path))
sitemap = REXML::Document.new(fetch(SITEMAP))
urls = []
sitemap.elements.each("urlset/url/loc") do |location|
  url = location.text.to_s
  next unless url.start_with?("https://www.podpage.com/uncovered-legacy/")
  break if url.include?("/guests/")
  urls << url unless url == "https://www.podpage.com/uncovered-legacy/"
end

unless urls.length == data["episodes"].length
  raise "Found #{urls.length} episode pages for #{data["episodes"].length} feed entries"
end

artwork_dir = File.join(ROOT, "images", "episodes")
FileUtils.mkdir_p(artwork_dir)
queue = Queue.new
urls.each_with_index { |url, index| queue << [url, index] }
errors = Queue.new

workers = 8.times.map do
  Thread.new do
    loop do
      url, index = queue.pop(true)
      page = fetch(url)
      encoded_image = page[/"thumbnailUrl": "([^"]+)"/, 1] || page[/<meta property="og:image" content="([^"]+)"/, 1]
      raise "No artwork found at #{url}" unless encoded_image
      image_url = CGI.unescapeHTML(encoded_image)
      episode = data["episodes"][index]
      extension = File.extname(URI(image_url).path).downcase
      extension = ".jpg" unless %w[.jpg .jpeg .png .webp].include?(extension)
      relative_path = "images/episodes/#{episode["id"]}#{extension}"
      Dir[File.join(artwork_dir, "#{episode["id"]}.*")].each { |old_path| FileUtils.rm_f(old_path) }
      File.binwrite(File.join(ROOT, relative_path), fetch(image_url))
      episode["artwork"] = relative_path
      puts "Imported #{index + 1}/#{urls.length}: #{episode["title"]}"
    rescue ThreadError
      break
    rescue StandardError => error
      errors << error
    end
  end
end
workers.each(&:join)
raise errors.pop unless errors.empty?

File.write(episodes_path, JSON.pretty_generate(data) + "\n")
puts "Imported artwork for #{urls.length} episodes"
