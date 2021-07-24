compile:
	pip-compile requirements.in > requirements.txt
	pip-compile dev.in > dev.txt
