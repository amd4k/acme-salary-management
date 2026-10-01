require "test_helper"

class EmployeeTest < ActiveSupport::TestCase
  test "is valid with required attributes" do
    country = Country.create!(name: "India", code: "IN")

    employee = Employee.new(
      employee_number: "EMP001",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      country: country,
      department: "Engineering",
      employment_status: "active"
    )

    assert employee.valid?
  end

  test "requires an employee number" do
    country = Country.create!(name: "India", code: "IN")

    employee = Employee.new(
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      country: country,
      department: "Engineering",
      employment_status: "active"
    )

    assert_not employee.valid?
    assert_includes employee.errors[:employee_number], "can't be blank"
  end

  test "requires a unique employee number" do
    country = Country.create!(name: "India", code: "IN")

    Employee.create!(
      employee_number: "EMP001",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      country: country,
      department: "Engineering",
      employment_status: "active"
    )

    employee = Employee.new(
      employee_number: "EMP001",
      first_name: "Jane",
      last_name: "Doe",
      email: "jane.doe@example.com",
      country: country,
      department: "Engineering",
      employment_status: "active"
    )

    assert_not employee.valid?
    assert_includes employee.errors[:employee_number], "has already been taken"
  end

  test "requires a country" do
    employee = Employee.new(
      employee_number: "EMP002",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      department: "Engineering",
      employment_status: "active"
    )

    assert_not employee.valid?
    assert_includes employee.errors[:country], "must exist"
  end
  
  test "cannot be deleted if salary records exist" do
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

    SalaryRecord.create!(
      employee: employee,
      amount: 75000,
      currency: "USD",
      effective_from: Date.new(2026, 1, 1),
      reason: "Initial salary",
      created_by: user
    )

    assert_not employee.destroy

    assert_includes employee.errors[:base], "Cannot delete record because dependent salary records exist"
  end
  
end
