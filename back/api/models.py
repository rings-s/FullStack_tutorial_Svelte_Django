import os
from django.db import models
from django.utils.translation import gettext_lazy as _

# Helper function to define upload paths
def resource_file_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/resources/<resource_id>/<filename>
    return f'resources/{instance.id}/files/{filename}'

def resource_image_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/resources/<resource_id>/images/<filename>
    # Using resource.id assumes the Resource instance is saved first if image is added simultaneously.
    # Or, if ResourceImage is saved separately, instance.resource.id works.
    return f'resources/{instance.resource.id}/images/{filename}'

class Resource(models.Model):
    """
    Model representing a learning resource.
    """
    title = models.CharField(_("Title"), max_length=200)
    description = models.TextField(_("Description"), blank=True, null=True)
    # Optional file associated with the resource
    resource_file = models.FileField(
        _("Resource File"),
        upload_to=resource_file_path,
        blank=True,
        null=True
    )
    tags = models.CharField(
        _("Tags"),
        max_length=255,
        blank=True,
        help_text=_("Comma-separated tags")
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    # Example helper method to get tags as a list
    def get_tags_list(self):
        if not self.tags:
            return []
        return [tag.strip() for tag in self.tags.split(',')]

class ResourceImage(models.Model):
    """
    Model representing an image related to a learning resource.
    Allows multiple images per resource.
    """
    resource = models.ForeignKey(
        Resource,
        related_name='images', # Allows accessing images from a Resource instance: resource.images.all()
        on_delete=models.CASCADE # Delete images if the resource is deleted
    )
    image = models.ImageField(
        _("Image"),
        upload_to=resource_image_path
    )
    caption = models.CharField(_("Caption"), max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Get the filename from the image path
        return f"Image for {self.resource.title} ({os.path.basename(self.image.name)})"
