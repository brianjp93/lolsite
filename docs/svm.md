# ML to guess roles

[Scikit-learn Support Vector Machine](https://scikit-learn.org/stable/modules/svm.html)

The riot api returns guesses as to which `role` and `lane` a participant was in.  This guess is often right, but too often wrong.  To aid in guessing roles, I used scikit-learn's support vector machine and hand labeled about 1000 participant roles.

So far I have been quite pleased with the assignments it has come up with. I have not actually calculated it, but I would guess it is making errors 5 to 10x less than Riot is.

## Training the SVM

1. Label data
    * go to https://hardstuck.club/set-roles/
2. start django shell
    * `python manage.py shell`

```python
>>> from match import tasks
>>> tasks.create_role_model_fit()
```

This will create a file called `role_predict.svc` which will be loaded up when predicting roles in future games.