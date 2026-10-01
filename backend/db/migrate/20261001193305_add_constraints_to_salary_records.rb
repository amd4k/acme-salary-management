class AddConstraintsToSalaryRecords < ActiveRecord::Migration[8.1]
  def change
    change_column :salary_records, :amount, :decimal, precision: 13, scale: 2, null: false
    change_column_null :salary_records, :currency, false
    change_column_null :salary_records, :effective_from, false
    change_column_null :salary_records, :reason, false
  end
end
