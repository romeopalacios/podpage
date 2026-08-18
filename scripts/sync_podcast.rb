#!/usr/bin/env ruby

require "cgi"
require "fileutils"
require "json"
require "net/http"
require "rexml/document"
require "time"
require "uri"

DEFAULT_FEED = "https://anchor.fm/s/4744f498/podcast/rss"
source = ARGV.fetch(0, DEFAULT_FEED)
destination = File.expand_path("../data/episodes.json", __dir__)

def read_source(source, redirect_limit = 5)
  return File.read(source) unless source.match?(%r{\Ahttps?://})
  raise "Too many feed redirects" if redirect_limit.zero?

  uri = URI(source)
  response = Net::HTTP.get_response(uri)
  return response.body if response.is_a?(Net::HTTPSuccess)
  return read_source(URI.join(source, response["location"]).to_s, redirect_limit - 1) if response.is_a?(Net::HTTPRedirection)

  raise "Feed request failed: HTTP #{response.code}"
end

xml = read_source(source)
document = REXML::Document.new(xml)

def text_at(element, path)
  element.elements[path]&.text.to_s.strip
end

def clean_text(html)
  decoded = CGI.unescapeHTML(html.to_s)
  decoded
    .gsub(/<br\s*\/?\s*>/i, "\n")
    .gsub(/<\/p>/i, "\n\n")
    .gsub(/<[^>]+>/, "")
    .gsub(/\u00a0/, " ")
    .gsub(/[ \t]+/, " ")
    .gsub(/\n{3,}/, "\n\n")
    .strip
end

items = []
document.elements.each("rss/channel/item") do |item|
  title = text_at(item, "title")
  season_match = title.match(/S(?:eason\s*)?0?(\d{1,2})\b/i)
  episode_match = title.match(/E(?:pisode\s*)?0?(\d{1,2})\b/i)
  season = text_at(item, "itunes:season").to_i
  episode = text_at(item, "itunes:episode").to_i
  season = season_match[1].to_i if season.zero? && season_match
  episode = episode_match[1].to_i if episode.zero? && episode_match
  episode_type = text_at(item, "itunes:episodeType")
  guid = text_at(item, "guid")

  items << {
    "id" => guid,
    "title" => title,
    "description" => clean_text(text_at(item, "description")),
    "published" => Time.parse(text_at(item, "pubDate")).utc.iso8601,
    "audio" => item.elements["enclosure"]&.attributes&.fetch("url", "").to_s,
    "duration" => text_at(item, "itunes:duration"),
    "season" => season.zero? ? nil : season,
    "episode" => episode.zero? ? nil : episode,
    "type" => episode_type.empty? ? "full" : episode_type
  }
end

# Older feed entries do not consistently include season metadata. The public
# archive defines 59 full episodes across six seasons in newest-to-oldest order.
season_sizes = [[6, 12], [5, 8], [4, 8], [3, 12], [2, 9], [1, 10]]
full_items = items.select { |item| item["type"] != "trailer" }
cursor = 0
season_sizes.each do |season, size|
  group = full_items[cursor, size] || []
  group.each_with_index do |item, index|
    item["season"] ||= season
    item["episode"] ||= size - index
  end
  cursor += size
end

FileUtils.mkdir_p(File.dirname(destination)) unless Dir.exist?(File.dirname(destination))
existing = File.exist?(destination) ? JSON.parse(File.read(destination)) : {}
existing_by_id = (existing["episodes"] || []).to_h { |episode| [episode["id"], episode] }
items.each do |item|
  artwork = existing_by_id.dig(item["id"], "artwork")
  item["artwork"] = artwork if artwork
end
if existing["episodes"] == items
  puts "No episode changes found"
  exit
end

File.write(destination, JSON.pretty_generate({
  "feed" => DEFAULT_FEED,
  "updated" => Time.now.utc.iso8601,
  "episodes" => items
}) + "\n")
puts "Wrote #{items.length} entries to #{destination}"
