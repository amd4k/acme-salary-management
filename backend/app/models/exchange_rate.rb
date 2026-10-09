
class ExchangeRate < ApplicationRecord
  validates :from_currency, :to_currency, :rate, :effective_on, presence: true

  scope :for_currency_pair, ->(from_currency, to_currency) {
    where(
      from_currency: from_currency,
      to_currency: to_currency
    )
  }

  def self.latest_for(from_currency:, to_currency:, as_of: Date.current)
    for_currency_pair(from_currency, to_currency)
      .where("effective_on <= ?", as_of)
      .order(effective_on: :desc, id: :desc)
      .first
  end
end
