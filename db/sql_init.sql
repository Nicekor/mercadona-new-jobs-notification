create database if not exists mercadona;

create table if not exists mercadona.new_jobs (
  id int primary key auto_increment,
  title varchar(255),
  link varchar(255)
);
