
require "test_helper"

class Api::V1::SalaryRecordsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @country = Country.create!(
      name: "United States",
      code: "US"
    )

    @employee = Employee.create!(
      employee_number: "EMP-000001",
      first_name: "John",
      last_name: "Smith",
      email: "john@example.com",
      country: @country,
      department: "Engineering",
      employment_status: "active"
    )

    @other_employee = Employee.create!(
      employee_number: "EMP-000002",
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      country: @country,
      department: "Finance",
      employment_status: "active"
    )

    @user = User.create!(
      first_name: "HR",
      last_name: "Manager",
      email: "hr@example.com",
      password: "password123"
    )

    @token = JsonWebToken.encode(@user.id)
    @headers = { "Authorization" => "Bearer #{@token}" }
  end

  test "requires authentication to list salary records" do
    get api_v1_salary_records_path

    assert_response :unauthorized
  end

  test "lists salary records with employee and country details" do
    create_salary_record(@employee, amount: 60_000)

    get api_v1_salary_records_path, headers: @headers

    assert_response :ok

    response_body = JSON.parse(response.body)
    records = response_body["salary_records"]

    assert_equal 1, records.length
    assert_equal 60_000, records.first["amount"].to_f
    assert_equal "USD", records.first["currency"]
    assert_equal "John", records.first.dig("employee", "first_name")
    assert_equal "Smith", records.first.dig("employee", "last_name")
    assert_equal "Engineering", records.first.dig("employee", "department")
    assert_equal "US", records.first.dig("employee", "country", "code")
    assert_equal 1, response_body.dig("pagination", "total")
  end

  test "searches salary records by employee full name" do
    create_salary_record(@employee, amount: 60_000)
    create_salary_record(@other_employee, amount: 70_000)

    get api_v1_salary_records_path,
      params: { search: "John Smith" },
      headers: @headers

    assert_response :ok

    response_body = JSON.parse(response.body)

    assert_equal 1, response_body["salary_records"].length
    assert_equal(
      "John",
      response_body.dig("salary_records", 0, "employee", "first_name")
    )
    assert_equal 1, response_body.dig("pagination", "total")
  end

  test "rejects invalid salary record pagination parameters" do
    get api_v1_salary_records_path,
      params: { page: 0, per_page: 25 },
      headers: @headers

    assert_response :bad_request
    assert_equal(
      "Invalid pagination parameters",
      JSON.parse(response.body)["error"]
    )
  end

  test "requires authentication to create a salary record" do
    post api_v1_employee_salary_records_path(@employee), params: {
      salary_record: {
        amount: 60_000,
        currency: "USD",
        effective_from: Date.current,
        reason: "Annual salary adjustment"
      }
    }

    assert_response :unauthorized
  end

  test "creates a salary record for an employee" do
    assert_difference("SalaryRecord.count", 1) do
      post api_v1_employee_salary_records_path(@employee),
        params: {
          salary_record: {
            amount: 60_000,
            currency: "USD",
            effective_from: Date.current,
            reason: "Annual salary adjustment"
          }
        },
        headers: @headers
    end

    assert_response :created

    salary_record = SalaryRecord.last

    assert_equal @employee.id, salary_record.employee_id
    assert_equal @user.id, salary_record.created_by_id
    assert_equal 60_000, salary_record.amount.to_f
    assert_equal "USD", salary_record.currency
    assert_equal Date.current, salary_record.effective_from
    assert_equal "Annual salary adjustment", salary_record.reason
  end

  test "returns the created salary record" do
    post api_v1_employee_salary_records_path(@employee),
      params: {
        salary_record: {
          amount: 75_000,
          currency: "USD",
          effective_from: Date.current,
          reason: "Promotion"
        }
      },
      headers: @headers

    assert_response :created

    response_body = JSON.parse(response.body)
    salary_record = response_body["salary_record"]

    assert_equal SalaryRecord.last.id, salary_record["id"]
    assert_equal @employee.id, salary_record["employee_id"]
    assert_equal "75000.0", salary_record["amount"]
    assert_equal "USD", salary_record["currency"]
    assert_equal Date.current.to_s, salary_record["effective_from"]
    assert_equal "Promotion", salary_record["reason"]
    assert_equal @user.id, salary_record["created_by_id"]
  end

  test "returns not found when employee does not exist" do
    post api_v1_employee_salary_records_path(999_999),
      params: {
        salary_record: {
          amount: 60_000,
          currency: "USD",
          effective_from: Date.current,
          reason: "Annual salary adjustment"
        }
      },
      headers: @headers

    assert_response :not_found
    assert_equal "Employee not found", JSON.parse(response.body)["error"]
  end

  test "returns unprocessable entity for invalid salary data" do
    post api_v1_employee_salary_records_path(@employee),
      params: {
        salary_record: {
          amount: nil,
          currency: "USD",
          effective_from: Date.current,
          reason: "Annual salary adjustment"
        }
      },
      headers: @headers

    assert_response :unprocessable_entity
    assert_includes JSON.parse(response.body)["error"], "Amount can't be blank"
  end

  test "prevents an HR user from creating their own salary record" do
    @user.update!(employee: @employee)

    assert_no_difference("SalaryRecord.count") do
      post api_v1_employee_salary_records_path(@employee),
        params: {
          salary_record: {
            amount: 80_000,
            currency: "USD",
            effective_from: Date.current,
            reason: "Salary adjustment"
          }
        },
        headers: @headers
    end

    assert_response :forbidden
    assert_equal(
      "You cannot change your own salary",
      JSON.parse(response.body)["error"]
    )
  end

  test "uses the authenticated user as created_by" do
    post api_v1_employee_salary_records_path(@employee),
      params: {
        salary_record: {
          amount: 65_000,
          currency: "USD",
          effective_from: Date.current,
          reason: "Salary adjustment",
          created_by_id: 999_999
        }
      },
      headers: @headers

    assert_response :created

    salary_record = SalaryRecord.last

    assert_equal @user.id, salary_record.created_by_id
    refute_equal 999_999, salary_record.created_by_id
  end

  test "allows creating a salary record for another employee" do
    post api_v1_employee_salary_records_path(@other_employee),
      params: {
        salary_record: {
          amount: 70_000,
          currency: "USD",
          effective_from: Date.current,
          reason: "Salary adjustment"
        }
      },
      headers: @headers

    assert_response :created

    salary_record = SalaryRecord.last

    assert_equal @other_employee.id, salary_record.employee_id
    assert_equal @user.id, salary_record.created_by_id
  end

  test "rejects a salary effective date in the past" do
    assert_no_difference("SalaryRecord.count") do
      post api_v1_employee_salary_records_path(@employee),
        params: {
          salary_record: {
            amount: 60_000,
            currency: "USD",
            effective_from: Date.current - 1.day,
            reason: "Salary adjustment"
          }
        },
        headers: @headers
    end

    assert_response :unprocessable_entity
    assert_equal(
      "Effective date cannot be in the past",
      JSON.parse(response.body)["error"]
    )
  end

  test "allows creating a new salary record based on the latest record" do
    previous_record = create_salary_record(@employee, amount: 60_000)

    assert_difference("SalaryRecord.count", 1) do
      post api_v1_employee_salary_records_path(@employee),
        params: {
          based_on_salary_record_id: previous_record.id,
          salary_record: {
            amount: 70_000,
            currency: "USD",
            effective_from: Date.current + 1.month,
            reason: "Annual salary adjustment"
          }
        },
        headers: @headers
    end

    assert_response :created

    previous_record.reload
    new_record = SalaryRecord.order(:id).last

    assert_equal 60_000, previous_record.amount.to_f
    assert_nil previous_record.updated_by_id

    assert_equal 70_000, new_record.amount.to_f
    assert_equal @employee.id, new_record.employee_id
    assert_equal @user.id, new_record.created_by_id
    assert_equal Date.current + 1.month, new_record.effective_from
  end

  test "rejects a salary change based on a record that is no longer latest" do
    old_record = create_salary_record(@employee, amount: 60_000)
    create_salary_record(
      @employee,
      amount: 65_000,
      effective_from: Date.current + 1.month
    )

    assert_no_difference("SalaryRecord.count") do
      post api_v1_employee_salary_records_path(@employee),
        params: {
          based_on_salary_record_id: old_record.id,
          salary_record: {
            amount: 70_000,
            currency: "USD",
            effective_from: Date.current + 2.months,
            reason: "Salary adjustment"
          }
        },
        headers: @headers
    end

    assert_response :unprocessable_entity
    assert_includes(
      JSON.parse(response.body)["error"],
      "latest scheduled salary record"
    )
  end

  test "rejects a new salary date earlier than the latest scheduled record" do
    latest_record = create_salary_record(
      @employee,
      amount: 60_000,
      effective_from: Date.current + 2.months
    )

    assert_no_difference("SalaryRecord.count") do
      post api_v1_employee_salary_records_path(@employee),
        params: {
          based_on_salary_record_id: latest_record.id,
          salary_record: {
            amount: 70_000,
            currency: "USD",
            effective_from: Date.current + 1.month,
            reason: "Salary adjustment"
          }
        },
        headers: @headers
    end

    assert_response :unprocessable_entity
    assert_includes(
      JSON.parse(response.body)["error"],
      "earlier than the latest scheduled salary record"
    )
  end

  private

  def create_salary_record(employee, amount:, effective_from: Date.current)
    SalaryRecord.create!(
      employee: employee,
      amount: amount,
      currency: "USD",
      effective_from: effective_from,
      reason: "Initial salary",
      created_by: @user
    )
  end
end
