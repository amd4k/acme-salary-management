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
  end

  test "requires authentication" do
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
        headers: {
          "Authorization" => "Bearer #{@token}"
        }
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
      headers: {
        "Authorization" => "Bearer #{@token}"
      }

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
      headers: {
        "Authorization" => "Bearer #{@token}"
      }

    assert_response :not_found

    response_body = JSON.parse(response.body)

    assert_equal "Employee not found", response_body["error"]
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
      headers: {
        "Authorization" => "Bearer #{@token}"
      }

    assert_response :unprocessable_entity

    response_body = JSON.parse(response.body)

    assert_includes response_body["error"], "Amount can't be blank"
  end

  test "prevents an HR user from changing their own salary" do
    @user.update!(employee: @employee)

    post api_v1_employee_salary_records_path(@employee),
      params: {
        salary_record: {
          amount: 80_000,
          currency: "USD",
          effective_from: Date.current,
          reason: "Salary adjustment"
        }
      },
      headers: {
        "Authorization" => "Bearer #{@token}"
      }

    assert_response :forbidden

    response_body = JSON.parse(response.body)

    assert_equal "You cannot change your own salary", response_body["error"]
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
      headers: {
        "Authorization" => "Bearer #{@token}"
      }

    assert_response :created

    salary_record = SalaryRecord.last

    assert_equal @user.id, salary_record.created_by_id
    refute_equal 999_999, salary_record.created_by_id
  end

  test "allows changing another employee's salary" do
    post api_v1_employee_salary_records_path(@other_employee),
      params: {
        salary_record: {
          amount: 70_000,
          currency: "USD",
          effective_from: Date.current,
          reason: "Salary adjustment"
        }
      },
      headers: {
        "Authorization" => "Bearer #{@token}"
      }

    assert_response :created

    salary_record = SalaryRecord.last

    assert_equal @other_employee.id, salary_record.employee_id
    assert_equal @user.id, salary_record.created_by_id
  end
end
