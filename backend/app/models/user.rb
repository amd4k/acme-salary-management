class User < ApplicationRecord
  has_secure_password
  
  belongs_to :employee, optional: true
  has_many :salary_records, foreign_key: :created_by_id

  validates :first_name, :last_name, :email, presence: true
  validates :email, uniqueness: true
end
