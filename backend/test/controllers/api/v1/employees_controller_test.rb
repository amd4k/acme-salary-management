require "test_helper"

class Api::V1::EmployeesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = User.create!(
      first_name: "Jane",
      last_name: "HR",
      email: "jane@example.com",
      password: "secure-password"
    )

    create_countries
    create_employees

    @token = JsonWebToken.encode(@user.id)
  end

  test "returns unauthorized without a token" do
    get "/api/v1/employees"

    assert_response :unauthorized
    assert_equal "Unauthorized", JSON.parse(response.body)["error"]
  end

  test "returns employees with a valid token" do
    get "/api/v1/employees",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 3, body["employees"].length
    assert_equal 1, body["pagination"]["page"]
    assert_equal 25, body["pagination"]["per_page"]
    assert_equal 3, body["pagination"]["total"]
    assert_equal 1, body["pagination"]["total_pages"]
  end

  test "returns paginated employees" do
    get "/api/v1/employees?page=1&per_page=2",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 2, body["employees"].length
    assert_equal "EMP-1", body["employees"][0]["employee_number"]
    assert_equal "EMP-2", body["employees"][1]["employee_number"]

    assert_equal 1, body["pagination"]["page"]
    assert_equal 2, body["pagination"]["per_page"]
    assert_equal 3, body["pagination"]["total"]
    assert_equal 2, body["pagination"]["total_pages"]
  end

  test "returns the next page of employees" do
    get "/api/v1/employees?page=2&per_page=2",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-3", body["employees"][0]["employee_number"]

    assert_equal 2, body["pagination"]["page"]
    assert_equal 2, body["pagination"]["per_page"]
    assert_equal 3, body["pagination"]["total"]
    assert_equal 2, body["pagination"]["total_pages"]
  end

  test "rejects an invalid page number" do
    get "/api/v1/employees?page=0&per_page=2",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :bad_request
    assert_equal(
      "Invalid pagination parameters",
      JSON.parse(response.body)["error"]
    )
  end

  test "rejects a per_page value greater than 100" do
    get "/api/v1/employees?page=1&per_page=101",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :bad_request
    assert_equal(
      "Invalid pagination parameters",
      JSON.parse(response.body)["error"]
    )
  end

  test "searches employees by last name" do
    get "/api/v1/employees?search=2",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-2", body["employees"][0]["employee_number"]
  end

  test "searches employees by email" do
    get "/api/v1/employees?search=employee3@example.com",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-3", body["employees"][0]["employee_number"]
  end
  
  test "searches employees by employee number" do
    get "/api/v1/employees?search=EMP-2",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-2", body["employees"][0]["employee_number"]
  end

  test "searches employees by first name" do
    get "/api/v1/employees?search=Employee",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 3, body["employees"].length
  end

  test "search is case insensitive" do
    get "/api/v1/employees?search=EMPLOYEE3@EXAMPLE.COM",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-3", body["employees"][0]["employee_number"]
  end  

  test "paginates search results" do
    get "/api/v1/employees?search=Employee&page=2&per_page=2",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-3", body["employees"][0]["employee_number"]

    assert_equal 2, body["pagination"]["page"]
    assert_equal 2, body["pagination"]["per_page"]
    assert_equal 3, body["pagination"]["total"]
    assert_equal 2, body["pagination"]["total_pages"]
  end

  test "filters employees by department" do
    get "/api/v1/employees?department=Finance",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-2", body["employees"][0]["employee_number"]
    assert_equal "Finance", body["employees"][0]["department"]

    assert_equal 1, body["pagination"]["total"]
    assert_equal 1, body["pagination"]["total_pages"]
  end

  test "filters employees by employment status" do
    get "/api/v1/employees?employment_status=inactive",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-3", body["employees"][0]["employee_number"]
    assert_equal "inactive", body["employees"][0]["employment_status"]

    assert_equal 1, body["pagination"]["total"]
    assert_equal 1, body["pagination"]["total_pages"]
  end

  test "filters employees by country" do
    get "/api/v1/employees?country_id=#{@country_ca.id}",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-3", body["employees"][0]["employee_number"]
    assert_equal "Canada", body["employees"][0]["country"]["name"]

    assert_equal 1, body["pagination"]["total"]
    assert_equal 1, body["pagination"]["total_pages"]
  end

  test "combines multiple employee filters" do
    get "/api/v1/employees?department=Engineering&employment_status=active",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :success

    body = JSON.parse(response.body)

    assert_equal 1, body["employees"].length
    assert_equal "EMP-1", body["employees"][0]["employee_number"]

    assert_equal 1, body["pagination"]["total"]
    assert_equal 1, body["pagination"]["total_pages"]
  end

  ##################

  test "requires authentication for employee details" do
    get "/api/v1/employees/#{@employee_1.id}"

    assert_response :unauthorized
  end

  test "returns employee details for an authenticated user" do
    get "/api/v1/employees/#{@employee_1.id}",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :ok

    response_body = JSON.parse(response.body)

    assert_equal @employee_1.id, response_body["employee"]["id"]
    assert_equal @employee_1.employee_number, response_body["employee"]["employee_number"]
    assert_equal @employee_1.first_name, response_body["employee"]["first_name"]
    assert_equal @employee_1.last_name, response_body["employee"]["last_name"]
  end

  test "includes country in employee details" do
    get "/api/v1/employees/#{@employee_1.id}",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :ok

    response_body = JSON.parse(response.body)

    assert_equal @country_us.id, response_body["employee"]["country"]["id"]
    assert_equal "United States", response_body["employee"]["country"]["name"]
    assert_equal "US", response_body["employee"]["country"]["code"]
  end

  test "returns nil current salary when employee has no salary records" do
    get "/api/v1/employees/#{@employee_1.id}",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :ok

    response_body = JSON.parse(response.body)

    assert_nil response_body["current_salary"]
    assert_equal [], response_body["salary_history"]
  end

  test "returns salary history ordered by effective date descending" do
    SalaryRecord.create!(
      employee: @employee_1,
      amount: 50_000,
      currency: "USD",
      effective_from: Date.new(2024, 1, 1),
      reason: "Initial salary",
      created_by: @user
    )

    SalaryRecord.create!(
      employee: @employee_1,
      amount: 60_000,
      currency: "USD",
      effective_from: Date.new(2025, 1, 1),
      reason: "Annual increase",
      created_by: @user
    )

    get "/api/v1/employees/#{@employee_1.id}",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :ok

    response_body = JSON.parse(response.body)
    salary_history = response_body["salary_history"]

    assert_equal 2, salary_history.length
    assert_equal "60000.0", salary_history[0]["amount"]
    assert_equal "2025-01-01", salary_history[0]["effective_from"]
    assert_equal "50000.0", salary_history[1]["amount"]
    assert_equal "2024-01-01", salary_history[1]["effective_from"]
  end

  test "returns the latest salary effective today or earlier as current salary" do
    SalaryRecord.create!(
      employee: @employee_1,
      amount: 50_000,
      currency: "USD",
      effective_from: Date.new(2024, 1, 1),
      reason: "Initial salary",
      created_by: @user
    )

    today = Date.current

    SalaryRecord.create!(
      employee: @employee_1,
      amount: 60_000,
      currency: "USD",
      effective_from: today,
      reason: "Current salary",
      created_by: @user
    )

    SalaryRecord.create!(
      employee: @employee_1,
      amount: 70_000,
      currency: "USD",
      effective_from: Date.current + 1.day,
      reason: "Future salary",
      created_by: @user
    )

    get "/api/v1/employees/#{@employee_1.id}",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :ok

    response_body = JSON.parse(response.body)

    assert_equal "60000.0", response_body["current_salary"]["amount"]
    assert_equal today.to_s, response_body["current_salary"]["effective_from"]
  end

  test "does not use a future salary as the current salary" do
    SalaryRecord.create!(
      employee: @employee_1,
      amount: 70_000,
      currency: "USD",
      effective_from: Date.current + 30.days,
      reason: "Future salary",
      created_by: @user
    )

    get "/api/v1/employees/#{@employee_1.id}",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :ok

    response_body = JSON.parse(response.body)

    assert_nil response_body["current_salary"]
  end

  test "returns not found for an unknown employee" do
    get "/api/v1/employees/999999",
        headers: { "Authorization" => "Bearer #{@token}" }

    assert_response :not_found

    response_body = JSON.parse(response.body)

    assert_equal "Employee not found", response_body["error"]
  end

  ##################

  private

  def create_countries
    @country_us = Country.create!(
      name: "United States",
      code: "US"
    )

    @country_ca = Country.create!(
      name: "Canada",
      code: "CA"
    )
  end

  def create_employees
    @employee_1 = Employee.create!(
      employee_number: "EMP-1",
      first_name: "Employee",
      last_name: "1",
      email: "employee1@example.com",
      country: @country_us,
      department: "Engineering",
      employment_status: "active"
    )

    @employee_2 = Employee.create!(
      employee_number: "EMP-2",
      first_name: "Employee",
      last_name: "2",
      email: "employee2@example.com",
      country: @country_us,
      department: "Finance",
      employment_status: "active"
    )

    @employee_3 = Employee.create!(
      employee_number: "EMP-3",
      first_name: "Employee",
      last_name: "3",
      email: "employee3@example.com",
      country: @country_ca,
      department: "Engineering",
      employment_status: "inactive"
    )
  end
  
end
