/* orbits.ddl */

/* orbits */
drop table orbits;
create table if not exists orbits ( id varchar(50) not null primary key, letter varchar(5) not null, data text default '', created bigint default 0, updated bigint default 0 );
