#!/bin/sh

find . -name '*.ts' -exec sed -i 's/\.ts/\.js/g' {} \;
