CREATE TABLE users (
    id serial PRIMARY KEY,
    first_name VARCHAR (50) NOT NULL,
    last_name VARCHAR (50) NOT NULL,
    email VARCHAR (255) UNIQUE NOT NULL,
    password VARCHAR (255) NOT NULL,
    password_create_date DATE NOT NULL DEFAULT CURRENT_DATE,
    country VARCHAR (50) NOT NULL,
    date_of_birth DATE NOT NULL,
    account_status VARCHAR (50) NOT NULL,
    account_create_date DATE NOT NULL DEFAULT CURRENT_DATE,
    email_validation VARCHAR(50) NOT NULL,
    gender VARCHAR (50) NOT NULL,
    reset_password_token VARCHAR(255)
);

CREATE TABLE products (
    id serial PRIMARY KEY,
    description VARCHAR(255),
    prod_status VARCHAR(50)
);

CREATE TABLE user_product (
    id serial PRIMARY KEY,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)  
)

CREATE TABLE admins (
    id serial PRIMARY KEY,
    first_name VARCHAR (50) NOT NULL,
    last_name VARCHAR (50) NOT NULL,
    email VARCHAR (255) UNIQUE NOT NULL,
    password VARCHAR (255) NOT NULL,
    password_create_date DATE NOT NULL DEFAULT CURRENT_DATE,
    account_status VARCHAR (50) NOT NULL,
    account_create_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reset_password_token VARCHAR(255)
);

