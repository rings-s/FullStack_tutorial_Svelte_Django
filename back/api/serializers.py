from rest_framework import serializers
from .models import Resource, ResourceImage

class ResourceImageSerializer(serializers.ModelSerializer):
    """
    Serializer for the ResourceImage model.
    """
    # Make resource field read-only in this context,
    # as we'll usually associate images via the Resource endpoint or a dedicated image upload endpoint.
    resource = serializers.PrimaryKeyRelatedField(read_only=True)
    # Return the full URL for the image field
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ResourceImage
        fields = ['id', 'resource', 'image', 'image_url', 'caption', 'uploaded_at']
        read_only_fields = ['id', 'resource', 'uploaded_at', 'image_url'] # `image` is handled by upload view

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class ResourceSerializer(serializers.ModelSerializer):
    """
    Serializer for the Resource model.
    Includes nested serialization for related images.
    """
    # Use the ResourceImageSerializer to represent related images
    # `many=True` because it's a one-to-many relationship
    # `read_only=True` because we'll handle image uploads separately or via specific actions
    images = ResourceImageSerializer(many=True, read_only=True)
    # Return the full URL for the resource file field
    resource_file_url = serializers.SerializerMethodField()
    # Represent tags as a list for frontend convenience
    tags_list = serializers.ListField(
        child=serializers.CharField(),
        source='get_tags_list', # Use the model method
        read_only=True # Tags are saved via the 'tags' CharField
    )

    class Meta:
        model = Resource
        fields = [
            'id',
            'title',
            'description',
            'resource_file', # Keep for uploads
            'resource_file_url', # Read-only URL
            'tags', # Writable field for comma-separated tags
            'tags_list', # Read-only list representation
            'images', # Read-only nested images
            'created_at',
            'updated_at'
        ]
        # resource_file is handled by parsers, tags is written directly
        read_only_fields = ['id', 'created_at', 'updated_at', 'resource_file_url', 'images', 'tags_list']

    def get_resource_file_url(self, obj):
        request = self.context.get('request')
        if obj.resource_file and request:
            return request.build_absolute_uri(obj.resource_file.url)
        return None

    def create(self, validated_data):
        # Handle tags string if needed (e.g., clean up extra spaces)
        if 'tags' in validated_data:
            tags_list = [tag.strip() for tag in validated_data['tags'].split(',') if tag.strip()]
            validated_data['tags'] = ','.join(tags_list)
        return super().create(validated_data)

    def update(self, instance, validated_data):
         # Handle tags string if needed
        if 'tags' in validated_data:
            tags_list = [tag.strip() for tag in validated_data['tags'].split(',') if tag.strip()]
            validated_data['tags'] = ','.join(tags_list)
        # Note: File fields might need special handling if you want partial updates
        # or clearing the file. By default, if 'resource_file' is not in validated_data,
        # it remains unchanged. To clear it, you might need explicit logic or pass null.
        return super().update(instance, validated_data)
