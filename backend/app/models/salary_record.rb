class SalaryRecord < ApplicationRecord
  belongs_to :employee
  belongs_to :created_by, class_name: "User"

  validates :amount, presence: true
  validates :currency, presence: true
  validates :effective_from, presence: true
  validates :reason, presence: true
end
