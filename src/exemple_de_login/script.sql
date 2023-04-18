create database if not exists loginBD;
use loginBD;
create table if not exists comptes (
    `id` int(11) not null auto_increment,
    `username` varchar(50) not null,
    `password` varchar(255) not null,
    primary key (`id`)
);

insert into comptes (`id`, `username`, `password`) values (1, 'usrname', 'pwd');
insert into comptes (`id`, `username`, `password`) values (2, 'william', 'leBOL');

create user if not exists 'admin' identified with mysql_native_password by 'Supermotdepasse';
grant all on loginBD.* to 'admin';
