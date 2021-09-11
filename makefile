compile:
	pip-compile requirements.in > requirements.txt
	pip-compile dev.in > dev.txt
install:
	pip install -r requirements.txt
	pip install -r dev.txt
run:
	docker-compose up
