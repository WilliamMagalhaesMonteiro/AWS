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

insert into comptes (`username`, `password`) values ('a', 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb');
insert into comptes (`username`, `password`) values ('b', '3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d');
insert into comptes (`username`, `password`) values ('william', '4433b09f42c7d2b77efc1c5fe8e1bea36106bbdc39530dbd4f1c7cf463720acd');
insert into comptes (`username`, `password`) values ('hugo', '18a3864b0d2777a9e62ec44d6de4b6d76da0aab1740c6e7b62ac0725e01f1c33');
insert into comptes (`username`, `password`) values ('asmaa', 'ff2f12ec5c6a2e9ef6b61c958ed701c327469190a18075fd909ec2a9b42b94f2');
insert into comptes (`username`, `password`) values ('christian', 'ec8fa439e37f079e8751a35b1e48729603a7841a62d44de804fa5a92ccaece8e');

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
