all:
.SILENT:
PRECMD=echo "  $(@F)" ; mkdir -p $(@D) ;

serve:;http-server -a localhost src/www
