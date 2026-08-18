#!/usr/bin/env ruby

require "cgi"
require "fileutils"
require "json"
require "net/http"
require "time"
require "uri"

SOURCE = ARGV.fetch(0, "https://www.podpage.com/uncovered-legacy/reviews/")
DESTINATION = File.expand_path("../data/reviews.json", __dir__)

def read_source(source)
  return File.read(source) unless source.match?(%r{\Ahttps?://})
  response = Net::HTTP.get_response(URI(source))
  raise "Review request failed: HTTP #{response.code}" unless response.is_a?(Net::HTTPSuccess)
  response.body
end

def clean_html(value)
  CGI.unescapeHTML(value.to_s.gsub(/<[^>]+>/, " ").gsub(/\s+/, " ").strip)
end

html = read_source(SOURCE).force_encoding("UTF-8")
blocks = html.scan(/<div class="masonry-item\b.*?(?=<div class="masonry-item\b|<\/section>)/m)
reviews = blocks.map do |block|
  body = block[/<div class="card-text">(.*?)<\/div>/m, 1]
  next unless body
  {
    "title" => clean_html(block[/<h5 class="heading heading-5 strong-600">.*?<a [^>]*>(.*?)<\/a>/m, 1]),
    "body" => clean_html(body),
    "author" => clean_html(block[/<li aria-label="author name">(.*?)<\/li>/m, 1]),
    "date" => clean_html(block[/<li aria-label="publish date">(.*?)<\/li>/m, 1]),
    "rating" => block.scan(/class="fas fa-star /).length
  }
end.compact

raise "No reviews found" if reviews.empty?
existing = File.exist?(DESTINATION) ? JSON.parse(File.read(DESTINATION)) : {}
if existing["reviews"] == reviews
  puts "No review changes found"
  exit
end

FileUtils.mkdir_p(File.dirname(DESTINATION))
File.write(DESTINATION, JSON.pretty_generate({ "updated" => Time.now.utc.iso8601, "reviews" => reviews }) + "\n")
puts "Wrote #{reviews.length} reviews to #{DESTINATION}"
