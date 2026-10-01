require "test_helper"

class CountryTest < ActiveSupport::TestCase
  test "is valid with a name and code" do
    country = Country.new(name: "India", code: "IN")

    assert country.valid?
  end

  test "requires a name" do
    country = Country.new(name: nil, code: "IN")

    assert_not country.valid?
    assert_includes country.errors[:name], "can't be blank"
  end

  test "requires a code" do
    country = Country.new(name: "India", code: nil)

    assert_not country.valid?
    assert_includes country.errors[:code], "can't be blank"
  end

  test "requires a unique code" do
    Country.create!(name: "India", code: "IN")

    country = Country.new(name: "Another India", code: "IN")

    assert_not country.valid?
    assert_includes country.errors[:code], "has already been taken"
  end
end
