#!/bin/sh

DIR=$1
echo "" > $DIR/index.ts
for file in `find $DIR -type f ! -name "index.ts"`
do
  filepath=${file##*${DIR}}
  filepath=${filepath%.*}
  echo "export * from  \"./$filepath\";" >> $DIR/index.ts
done
