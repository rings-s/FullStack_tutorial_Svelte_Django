from django.contrib import admin
from .models import Resource, ResourceImage
# Register your models here.



class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'description', 'created_at')
    search_fields = ('title', 'description')
    list_filter = ('created_at',)

class ResourceImageAdmin(admin.ModelAdmin):
    list_display = ('resource', 'image')
    search_fields = ('resource__title', 'image')
    list_filter = ('resource__created_at',)

admin.site.register(Resource, ResourceAdmin)
admin.site.register(ResourceImage, ResourceImageAdmin)
