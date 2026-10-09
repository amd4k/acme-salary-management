require "test_helper"

class ExchangeRateTest < ActiveSupport::TestCase
  test "is valid with all required attributes" do
    exchange_rate = ExchangeRate.new(
      from_currency: "EUR",
      to_currency: "USD",
      rate: 1.170000,
      effective_on: Date.current
    )

    assert exchange_rate.valid?
  end

  test "requires from_currency" do
    exchange_rate = ExchangeRate.new(
      to_currency: "USD",
      rate: 1.170000,
      effective_on: Date.current
    )

    assert_not exchange_rate.valid?
    assert_includes exchange_rate.errors[:from_currency], "can't be blank"
  end

  test "requires to_currency" do
    exchange_rate = ExchangeRate.new(
      from_currency: "EUR",
      rate: 1.170000,
      effective_on: Date.current
    )

    assert_not exchange_rate.valid?
    assert_includes exchange_rate.errors[:to_currency], "can't be blank"
  end

  test "requires rate" do
    exchange_rate = ExchangeRate.new(
      from_currency: "EUR",
      to_currency: "USD",
      effective_on: Date.current
    )

    assert_not exchange_rate.valid?
    assert_includes exchange_rate.errors[:rate], "can't be blank"
  end

  test "requires effective_on" do
    exchange_rate = ExchangeRate.new(
      from_currency: "EUR",
      to_currency: "USD",
      rate: 1.170000
    )

    assert_not exchange_rate.valid?
    assert_includes exchange_rate.errors[:effective_on], "can't be blank"
  end


  test "returns the latest rate effective on or before the requested date" do
    older_rate = ExchangeRate.create!(
      from_currency: "EUR",
      to_currency: "USD",
      rate: 1.100000,
      effective_on: Date.new(2026, 1, 1)
    )

    latest_rate = ExchangeRate.create!(
      from_currency: "EUR",
      to_currency: "USD",
      rate: 1.150000,
      effective_on: Date.new(2026, 6, 1)
    )

    ExchangeRate.create!(
      from_currency: "EUR",
      to_currency: "USD",
      rate: 1.200000,
      effective_on: Date.new(2026, 12, 1)
    )

    result = ExchangeRate.latest_for(
      from_currency: "EUR",
      to_currency: "USD",
      as_of: Date.new(2026, 10, 9)
    )

    assert_equal latest_rate.id, result.id
    refute_equal older_rate.id, result.id
  end

  test "returns nil when no rate is effective by the requested date" do
    ExchangeRate.create!(
      from_currency: "EUR",
      to_currency: "USD",
      rate: 1.150000,
      effective_on: Date.new(2026, 12, 1)
    )

    result = ExchangeRate.latest_for(
      from_currency: "EUR",
      to_currency: "USD",
      as_of: Date.new(2026, 10, 9)
    )

    assert_nil result
  end

  test "does not return a rate for a different currency pair" do
    ExchangeRate.create!(
      from_currency: "GBP",
      to_currency: "USD",
      rate: 1.300000,
      effective_on: Date.new(2026, 1, 1)
    )

    result = ExchangeRate.latest_for(
      from_currency: "EUR",
      to_currency: "USD",
      as_of: Date.new(2026, 10, 9)
    )

    assert_nil result
  end

end
