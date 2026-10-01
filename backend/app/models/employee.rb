class Employee < ApplicationRecord
  belongs_to :country

  validates :employee_number, presence: true, uniqueness: true
  validates :first_name, :last_name, :email, :department, :employment_status, presence: true
end
