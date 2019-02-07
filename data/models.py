from django.db import models


class Rito(models.Model):
    token = models.CharField(max_length=256, default='', blank=True)

    def __str__(self):
        return f'Rito(token="{self.token}")'


class Queue(models.Model):
    _id = models.IntegerField(unique=True)
    _map = models.CharField(max_length=128, default='', blank=True)
    description = models.CharField(max_length=256, default='', blank=True)

    def __str__(self):
        return f'Queue(_id={self._id}, _map="{self._map}")'

    def get_map(self):
        """Return the corresponding map model.
        """
        out = None
        query = Map.objects.filter(name__iexact=self._map)
        if query.exists():
            out = query.first()
        return out


class Season(models.Model):
    _id = models.IntegerField(unique=True)
    name = models.CharField(max_length=128, default='', blank=True)

    def __str__(self):
        return f'Season(_id={self._id}, name="{self.name}")'


class Map(models.Model):
    _id = models.IntegerField(unique=True)
    name = models.CharField(max_length=256, default='', blank=True)
    notes = models.CharField(max_length=256, default='', blank=True)

    def __str__(self):
        return f'Map(name="{self.name}")'


class GameMode(models.Model):
    name = models.CharField(unique=True, max_length=128, default='', blank=True)
    description = models.CharField(max_length=256, default='', blank=True)

    def __str__(self):
        return f'GameMode(name="{self.name}")'


class GameType(models.Model):
    name = models.CharField(unique=True, max_length=128, default='', blank=True)
    description = models.CharField(max_length=256, default='', blank=True)

    def __str__(self):
        return f'GameType(name="{self.name}")'


class ReforgedTree(models.Model):
    _id = models.IntegerField(db_index=True)
    language = models.CharField(max_length=32, default='en_US', db_index=True, blank=True)
    version = models.CharField(max_length=32, default='', db_index=True, blank=True)
    icon = models.CharField(max_length=128, default='', blank=True)
    key = models.CharField(max_length=128, default='', blank=True)
    name = models.CharField(max_length=128, default='', blank=True)

    class Meta:
        unique_together = ('_id', 'language', 'version')


    def __str__(self):
        return f'ReforgedTree(_id={self._id}, language="{self.language}", version="{self.version}")'


class ReforgedRune(models.Model):
    reforgedtree = models.ForeignKey('ReforgedTree', on_delete=models.CASCADE, related_name='reforgedrunes')
    _id = models.IntegerField(db_index=True)
    icon = models.CharField(max_length=256, default='', blank=True)
    key = models.CharField(max_length=128, default='', blank=True)
    long_description = models.CharField(max_length=2048, default='', blank=True)
    name = models.CharField(max_length=128, default='', blank=True)
    short_description = models.CharField(max_length=1024, default='', blank=True)
    row = models.IntegerField()
    sort_int = models.IntegerField()

    class Meta:
        unique_together = ('reforgedtree', '_id')


class Item(models.Model):
    _id = models.IntegerField(db_index=True)
    version = models.CharField(max_length=128, default='', db_index=True, blank=True)
    language = models.CharField(max_length=32, default='en_US', db_index=True, blank=True)
    colloq = models.CharField(max_length=256, default='', blank=True)
    depth = models.IntegerField(null=True)
    group = models.CharField(max_length=128, default='', blank=True)
    description = models.CharField(max_length=2048, default='', blank=True)
    name = models.CharField(max_length=256, default='', blank=True)
    plaintext = models.CharField(max_length=256, default='', blank=True)
    required_ally = models.CharField(max_length=256, default='', blank=True)
    required_champion = models.CharField(max_length=256, default='', blank=True)
    in_store = models.BooleanField(default=True)
    consumed = models.BooleanField(default=False)
    consume_on_full = models.BooleanField(default=False)
    special_recipe = models.IntegerField(null=True, blank=True)
    stacks = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('_id', 'version', 'language')


class ItemEffect(models.Model):
    item = models.ForeignKey('Item', on_delete=models.CASCADE, related_name='effects')
    key = models.CharField(max_length=256, default='')
    value = models.FloatField()

    class Meta:
        unique_together = ('item', 'key')


class FromItem(models.Model):
    item = models.ForeignKey('Item', on_delete=models.CASCADE, related_name='fromitems')
    _id = models.IntegerField()


class IntoItem(models.Model):
    item = models.ForeignKey('Item', on_delete=models.CASCADE, related_name='intoitems')
    _id = models.IntegerField()


class ItemGold(models.Model):
    item = models.OneToOneField('Item', on_delete=models.CASCADE, related_name='gold')
    base = models.IntegerField()
    purchasable = models.BooleanField(default=False)
    sell = models.IntegerField()
    total = models.IntegerField()


class ItemImage(models.Model):
    item = models.OneToOneField('Item', on_delete=models.CASCADE, related_name='image')
    full = models.CharField(max_length=128, default='', blank=True)
    group = models.CharField(max_length=128)
    h = models.IntegerField()
    sprite = models.CharField(max_length=128)
    w = models.IntegerField()
    x = models.IntegerField()
    y = models.IntegerField()


class ItemMap(models.Model):
    item = models.ForeignKey('Item', on_delete=models.CASCADE, related_name='maps')
    key = models.IntegerField()
    value = models.BooleanField()

    class Meta:
        unique_together = ('item', 'key')


class ItemStat(models.Model):
    item = models.ForeignKey('Item', on_delete=models.CASCADE, related_name='stats')
    key = models.CharField(max_length=128, default='')
    value = models.FloatField()

    class Meta:
        unique_together = ('item', 'key')


class ItemTag(models.Model):
    items = models.ManyToManyField('Item', related_name='tags')
    name = models.CharField(max_length=128, default='', unique=True)


class ItemRune(models.Model):
    item = models.OneToOneField('Item', related_name='rune', on_delete=models.CASCADE)
    is_rune = models.BooleanField(default=False)
    tier = models.IntegerField()
    _type = models.CharField(max_length=128, default='', blank=True)