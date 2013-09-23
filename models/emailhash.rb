#encoding: UTF-8

require 'digest'

class EmailHash
  include Mongoid::Document
  include Mongoid::Timestamps
                        
  field :hashed_email, type: String

  validates :hashed_email, presence: true
  validates :hashed_email, uniqueness: true
end