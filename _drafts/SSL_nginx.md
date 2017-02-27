openssl genrsa -des3 -out foo.bar.com.key 1024
openssl req -new -key foo.bar.com.key -out foo.bar.com.csr
openssl x509 -req -days 3650 -in foo.bar.com.csr -signkey foo.bar.com.key -out foo.bar.com.crt

