
Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post "login", to: "sessions#create"
      get "dashboard/statistics", to: "dashboard#statistics"

      resources :salary_records, only: [:index]

      resources :employees, only: [:index, :show] do
        resources :salary_records, only: [:create, :update]
      end
    end
  end
end
