require "test_helper"

class SalaryRecordTest < ActiveSupport::TestCase
  test "is valid with required attributes" do
    country = Country.create!(name: "India", code: "IN")

    employee = Employee.create!(
      employee_number: "EMP001",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      country: country,
      department: "Engineering",
      employment_status: "active"
    )

    user = User.create!(
      first_name: "Jane",
      last_name: "HR",
      email: "jane.hr@example.com",
      password_digest: "test-password-digest"
    )

    salary_record = SalaryRecord.new(
      employee: employee,
      amount: 75000,
      currency: "USD",
      effective_from: Date.new(2026, 1, 1),
      reason: "Annual salary adjustment",
      created_by: user
    )

    assert salary_record.valid?
  end

  test "requires an employee" do
    user = User.create!(
      first_name: "Jane",
      last_name: "HR",
      email: "jane.hr@example.com",
      password_digest: "test-password-digest"
    )

    salary_record = SalaryRecord.new(
      amount: 75000,
      currency: "USD",
      effective_from: Date.new(2026, 1, 1),
      reason: "Annual salary adjustment",
      created_by: user
    )

    assert_not salary_record.valid?
    assert_includes salary_record.errors[:employee], "must exist"
  end

  test "requires a creator" do
    country = Country.create!(name: "India", code: "IN")

    employee = Employee.create!(
      employee_number: "EMP001",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      country: country,
      department: "Engineering",
      employment_status: "active"
    )

    salary_record = SalaryRecord.new(
      employee: employee,
      amount: 75000,
      currency: "USD",
      effective_from: Date.new(2026, 1, 1),
      reason: "Annual salary adjustment"
    )

    assert_not salary_record.valid?
    assert_includes salary_record.errors[:created_by], "must exist"
  end

  test "requires amount, currency, effective date and reason" do
    country = Country.create!(name: "India", code: "IN")

    employee = Employee.create!(
      employee_number: "EMP001",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      country: country,
      department: "Engineering",
      employment_status: "active"
    )

    user = User.create!(
      first_name: "Jane",
      last_name: "HR",
      email: "jane.hr@example.com",
      password_digest: "test-password-digest"
    )

    salary_record = SalaryRecord.new(
      employee: employee,
      created_by: user
    )

    assert_not salary_record.valid?
    assert_includes salary_record.errors[:amount], "can't be blank"
    assert_includes salary_record.errors[:currency], "can't be blank"
    assert_includes salary_record.errors[:effective_from], "can't be blank"
    assert_includes salary_record.errors[:reason], "can't be blank"
  end
end