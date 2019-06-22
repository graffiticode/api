heroku pg:psql -c "select language, id, ast from pieces where language='L106' order by id;" > l106.out
