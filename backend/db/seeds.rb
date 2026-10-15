
# backend/db/seeds.rb

require "faker"
require "set"

# Keep generated data repeatable between runs.
Faker::Config.random = Random.new(20_261_014)
random = Random.new(20_261_014)

puts "Seeding ACME Salary Management..."

# --------------------------------------------------
# 1. Countries
# --------------------------------------------------

country_data = [
  { name: "United States", code: "US" },
  { name: "India", code: "IN" },
  { name: "United Kingdom", code: "GB" },
  { name: "Germany", code: "DE" },
  { name: "Canada", code: "CA" },
  { name: "Australia", code: "AU" },
  { name: "Singapore", code: "SG" },
  { name: "Netherlands", code: "NL" }
]

country_data.each do |attributes|
  Country.find_or_create_by!(code: attributes[:code]) do |country|
    country.name = attributes[:name]
  end
end

countries = Country.where(code: country_data.map { |c| c[:code] }).index_by(&:code)

puts "Countries ready: #{countries.size}"

# --------------------------------------------------
# 2. Development HR user
# --------------------------------------------------
# Reuse the existing user as the salary-record creator.
# Do not change their password or create a surprise login.

hr_user = User.order(:id).first

unless hr_user
  hr_user = User.create!(
    first_name: "Jane",
    last_name: "HR",
    email: "hr.admin@acme.example",
    password: SecureRandom.hex(16),
    employee_id: nil
  )

  puts "Created a development HR user: #{hr_user.email}"
  puts "A random password was generated. Set a known local password before login."
end

# --------------------------------------------------
# 3. Employees: 10,000 total
# --------------------------------------------------

target_employee_count = 10_000
department_names = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Sales",
  "Marketing",
  "Operations",
  "Product",
  "Customer Support"
]

country_codes = country_data.map { |country| country[:code] }

existing_numbers = Employee.pluck(:employee_number).to_set
employees_to_insert = []
next_number = 1

while Employee.count + employees_to_insert.size < target_employee_count
  employee_number = format("ACME%06d", next_number)
  next_number += 1

  next if existing_numbers.include?(employee_number)

  first_name = Faker::Name.first_name
  last_name = Faker::Name.last_name
  email = "#{employee_number.downcase}@employees.acme.example"

  employees_to_insert << {
    employee_number: employee_number,
    first_name: first_name,
    last_name: last_name,
    email: email,
    country_id: countries.fetch(country_codes.sample(random: random)).id,
    department: department_names.sample(random: random),
    employment_status: random.rand < 0.92 ? "active" : "inactive",
    created_at: Time.current,
    updated_at: Time.current
  }

  existing_numbers.add(employee_number)

  if employees_to_insert.size >= 1_000
    Employee.insert_all!(employees_to_insert)
    employees_to_insert.clear
    puts "Employees created: #{Employee.count}"
  end
end

Employee.insert_all!(employees_to_insert) if employees_to_insert.any?

puts "Employee total: #{Employee.count}"

# --------------------------------------------------
# 4. Salary records
# --------------------------------------------------
# Every employee gets one initial salary record.
# Every fifth employee gets an additional historical record.
# Effective dates are in the past so current salary is available.
#
# The existing schema has no unique constraint on employee_id
# plus effective_from, so we check for existing combinations.

currencies_by_country = {
  "US" => "USD",
  "IN" => "INR",
  "GB" => "GBP",
  "DE" => "EUR",
  "CA" => "CAD",
  "AU" => "AUD",
  "SG" => "SGD",
  "NL" => "EUR"
}

existing_salary_keys = SalaryRecord.pluck(:employee_id, :effective_from).to_set
salary_rows = []
today = Date.current

Employee.includes(:country).find_each.with_index(1) do |employee, index|
  currency = currencies_by_country.fetch(employee.country.code, "USD")
  base_date = today - random.rand(30..900).days
  amount = random.rand(40_000..150_000)

  unless existing_salary_keys.include?([employee.id, base_date])
    salary_rows << {
      employee_id: employee.id,
      amount: amount,
      currency: currency,
      effective_from: base_date,
      reason: "Initial salary",
      created_by_id: hr_user.id,
      updated_by_id: nil,
      created_at: Time.current,
      updated_at: Time.current
    }

    existing_salary_keys.add([employee.id, base_date])
  end

  if (index % 5).zero?
    historical_date = base_date - 365.days

    unless existing_salary_keys.include?([employee.id, historical_date])
      salary_rows << {
        employee_id: employee.id,
        amount: (amount * 0.90).round(2),
        currency: currency,
        effective_from: historical_date,
        reason: "Annual salary adjustment",
        created_by_id: hr_user.id,
        updated_by_id: nil,
        created_at: Time.current,
        updated_at: Time.current
      }

      existing_salary_keys.add([employee.id, historical_date])
    end
  end

  if salary_rows.size >= 1_000
    SalaryRecord.insert_all!(salary_rows)
    salary_rows.clear
  end
end

SalaryRecord.insert_all!(salary_rows) if salary_rows.any?

puts "Salary records total: #{SalaryRecord.count}"

# --------------------------------------------------
# 5. Demonstration exchange rates
# --------------------------------------------------
# These are illustrative values, NOT live FX rates.
# They are intentionally stored as rates to USD.

demo_rates_to_usd = {
  "USD" => 1.0,
  "INR" => 0.012,
  "GBP" => 1.30,
  "EUR" => 1.08,
  "CAD" => 0.72,
  "AUD" => 0.65,
  "SGD" => 0.75
}

exchange_rate_rows = []

demo_rates_to_usd.each do |currency, rate|
  [today - 365.days, today].each do |effective_date|
    exists = ExchangeRate.exists?(
      from_currency: currency,
      to_currency: "USD",
      effective_on: effective_date
    )

    next if exists

    exchange_rate_rows << {
      from_currency: currency,
      to_currency: "USD",
      rate: rate,
      effective_on: effective_date,
      created_at: Time.current,
      updated_at: Time.current
    }
  end
end

ExchangeRate.insert_all!(exchange_rate_rows) if exchange_rate_rows.any?

puts "Exchange rates total: #{ExchangeRate.count}"
puts "Seeding complete."
