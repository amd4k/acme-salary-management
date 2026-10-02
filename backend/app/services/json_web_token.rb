class JsonWebToken
  ALGORITHM = "HS256" # It is a symmetric signing algorithm
  EXPIRATION = 1.hour

  def self.encode(user_id)
    payload = {
      sub: user_id,
      iat: Time.current.to_i,
      exp: EXPIRATION.from_now.to_i #exp is the expiration time as a Unix timestamp, meaning the number of seconds since 1 January 1970.
    }

    JWT.encode(payload, Rails.application.secret_key_base, ALGORITHM)
  end

  def self.decode(token)
    decoded = JWT.decode(
      token,                                 # Token received from React
      Rails.application.secret_key_base,     # Secret used to verify signature
      true,                                  # Verify the signature
      { algorithm: ALGORITHM }               # Only accept the configured algorithm
    )

    # JWT.decode returns [payload, header]. Return only the payload.
    decoded.first   

  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end
end