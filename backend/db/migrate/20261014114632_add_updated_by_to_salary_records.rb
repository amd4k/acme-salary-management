class AddUpdatedByToSalaryRecords < ActiveRecord::Migration[8.1]
  def change
    add_reference :salary_records,
                  :updated_by,
                  foreign_key: { to_table: :users },
                  null: true
  end
end
