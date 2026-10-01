class User < ApplicationRecord
  belongs_to :employee, optional: true

  validates :first_name, :last_name, :email, :password_digest, presence: true
  validates :email, uniqueness: true
end
