require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "is valid with required attributes" do
    user = User.new(
      first_name: "Jane",
      last_name: "HR",
      email: "jane.hr@example.com",
      password: "secure-password"
    )

    assert user.valid?
  end

  test "does not require an employee" do
    user = User.new(
      first_name: "Jane",
      last_name: "HR",
      email: "jane.hr@example.com",
      password: "secure-password"
    )

    assert user.valid?
    assert_nil user.employee
  end

  test "requires an email" do
    user = User.new(
      first_name: "Jane",
      last_name: "HR",
      email: nil,
      password: "secure-password"
    )

    assert_not user.valid?
    assert_includes user.errors[:email], "can't be blank"
  end
  
  test "requires a password when creating a user" do
    user = User.new(
      first_name: "Jane",
      last_name: "HR",
      email: "jane.hr@example.com"
    )

    assert_not user.valid?
    assert_includes user.errors[:password], "can't be blank"
  end

  test "requires matching password confirmation when provided" do
    user = User.new(
      first_name: "Jane",
      last_name: "HR",
      email: "jane.hr@example.com",
      password: "secure-password",
      password_confirmation: "different-password"
    )

    assert_not user.valid?
    assert_includes user.errors[:password_confirmation], "doesn't match Password"
  end

  test "requires a unique email" do
    User.create!(
      first_name: "Existing",
      last_name: "HR",
      email: "hr@example.com",
      password: "secure-password"
    )

    user = User.new(
      first_name: "Another",
      last_name: "HR",
      email: "hr@example.com",
      password: "secure-password"
    )

    assert_not user.valid?
    assert_includes user.errors[:email], "has already been taken"
  end

  test "authenticates with the correct password" do
    user = User.create!(
      first_name: "Jane",
      last_name: "HR",
      email: "jane.hr@example.com",
      password: "secure-password"
    )

    assert_equal user, user.authenticate("secure-password")
  end

  test "does not authenticate with the wrong password" do
    user = User.create!(
      first_name: "Jane",
      last_name: "HR",
      email: "jane.hr@example.com",
      password: "secure-password"
    )

    assert_not user.authenticate("wrong-password")
  end
end
