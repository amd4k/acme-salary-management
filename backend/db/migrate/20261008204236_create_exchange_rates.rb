class CreateExchangeRates < ActiveRecord::Migration[8.1]
  def change
    create_table :exchange_rates do |t|
      t.string :from_currency, null: false
      t.string :to_currency, null: false
      t.decimal :rate, precision: 13, scale: 6, null: false
      t.date :effective_on, null: false

      t.timestamps
    end

    add_index :exchange_rates,
      [:from_currency, :to_currency, :effective_on]
  end
end
