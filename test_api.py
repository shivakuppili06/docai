import urllib.request, json
req = urllib.request.Request('http://localhost:8080/api/auth/login', data=b'{}', headers={'Content-Type':'application/json'})
try:
    urllib.request.urlopen(req)
except Exception as e:
    print(e.read().decode('utf-8'))
