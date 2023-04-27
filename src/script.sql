drop database if exists loginBD;
create database loginBD;
use loginBD;
create table comptes (
    `id` int(11) not null auto_increment,
    `username` varchar(50) not null,
    `password` varchar(255) not null,
    primary key (`id`)
);
create table mots (
    `id` int(11) not null auto_increment,
    `mot` varchar(50) not null,
    `theme` varchar(50) not null,
    primary key (`id`)
);

insert into comptes (`username`, `password`) values ('william', 'leBOL');
insert into comptes (`username`, `password`) values ('hugo', 'squidGame');
insert into comptes (`username`, `password`) values ('asmaa', 'secure_password');
insert into comptes (`username`, `password`) values ('christian', '\_(-_-)_/');

insert into mots (`mot`, `theme`) values ('chat', 'animaux');
insert into mots (`mot`, `theme`) values ('chien', 'animaux');
insert into mots (`mot`, `theme`) values ('vache', 'animaux');
insert into mots (`mot`, `theme`) values ('panda', 'animaux');
insert into mots (`mot`, `theme`) values ('ours', 'animaux');
insert into mots (`mot`, `theme`) values ('macron', 'animaux');
insert into mots (`mot`, `theme`) values ('chèvre', 'animaux');
insert into mots (`mot`, `theme`) values ('naruto', 'anime');
insert into mots (`mot`, `theme`) values ('sasuke', 'anime');
insert into mots (`mot`, `theme`) values ('kakashi', 'anime');
insert into mots (`mot`, `theme`) values ('luffy', 'anime');
insert into mots (`mot`, `theme`) values ('zorro', 'anime');
insert into mots (`mot`, `theme`) values ('sangoku', 'anime');
insert into mots (`mot`, `theme`) values ('végéta', 'anime');
insert into mots (`mot`, `theme`) values ('killua', 'anime');

create user if not exists 'admin' identified with mysql_native_password by 'Supermotdepasse';
grant all on loginBD.* to 'admin';

desc comptes;
desc mots;
