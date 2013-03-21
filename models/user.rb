require 'digest'

class User
  include Mongoid::Document
  field :email, type: String
  field :mobile_number, type: String
  field :hashed_password, type: String
	field :notify_by_email, type: Boolean, default: false
	field :notify_by_sms, type: Boolean, default: false
	field :notify_by_push_note, type: Boolean, default: false
  field :active, type: Boolean, default: false # normally equivalent to "has paid"
  has_one :session
  embeds_one :filter
  @@salt = 'aa2c2c739ba0c61dc84345b1c2dc222f'
  
  validates :email, presence: true, uniqueness: true, length: { maximum: 64 }
  # Note that hashed_password isn't hashed at the point of validation
  validates :hashed_password, presence: true, length: { minimum: 6, maximum: 64}
  
  before_validation do |document|
    # When a user registers, downcase the email address.
    # This will downcase the email unnecessarily whenever the document
    # is updated. But life is life, what to do? 
    document.email.downcase!
  end

  # This is where hashed_password becomes true to it's name
  before_create do |document|
    document.hashed_password = encrypt(document.hashed_password)
  end
  
  def has_password?(submitted_password)
    self.hashed_password == encrypt(submitted_password)
  end

  def self.authenticate(email, submitted_password)
    user = self.find_by(email: email.downcase)
    return nil unless user
    return user if user.has_password?(submitted_password)
  end

  def change_password(new_password)
    self.hashed_password == encrypt(new_password)
    # We really want to validate the new_passord before it gets hashed.
    # We jut don't know how. Crap.
    self.save(validate: false)
  end

  def settings_to_hash()
    settings = {mobile_number: self.mobile_number,
                notify_by_email: self.notify_by_email,
                notify_by_sms: self.notify_by_sms,
                notify_by_push_note: self.notify_by_push_note,
                active: self.active,
                filter: {roomsMin: filter.rooms.first,
                         roomsMax: filter.rooms.last,
                         rent: filter.rent,
                         areaMin: filter.area.first,
                         areaMax: filter.area.last}}
  end

  def change_mobile_number(new_mobile_number)
    new_mobile_number = new_mobile_number.gsub(/\s+/, "")

    if new_mobile_number[0..1] == '00'
      # International number, same meaning as +.
      new_mobile_number.sub!('00', '+')
    elsif new_mobile_number[0] == '0'
      # Starts with 0 but isn't a country code, default to Swedish number.
      new_mobile_number.sub!('0', '+46')
    elsif new_mobile_number[0] != '+'
      # Comment for humans: If we got this far the number didn't start with a
      # single or double 0 and... it didn't even start with a plus.
      # Gasp! It must be from outer space, yao.
      raise MalformedMobileNumber 
    end
    
    self.mobile_number = new_mobile_number
    self.save(validate: false)
  end
  
  class MalformedMobileNumber < Exception
    def message
      "We do not accept extra-terrestrial phone numbers. Sorry."
    end
  end

  private
    
    def encrypt(s)
      hash_string(@@salt + s)
    end
    
    def hash_string(s)
      Digest::SHA2.hexdigest(s)
    end
end
