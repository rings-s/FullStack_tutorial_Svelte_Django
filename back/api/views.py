# backend/api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from .models import Resource, ResourceImage
from .serializers import ResourceSerializer, ResourceImageSerializer

class ResourceListCreateView(APIView):
    """
    View to list all resources or create a new resource.
    Handles GET (list) and POST (create) requests.
    Uses MultiPartParser and FormParser to handle file uploads along with JSON data.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request, format=None):
        """
        Return a list of all resources.
        """
        resources = Resource.objects.all().order_by('-created_at')
        # Pass request context to serializer to build absolute URLs
        serializer = ResourceSerializer(resources, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, format=None):
        """
        Create a new resource.
        Handles form data including optional file uploads.
        """
        serializer = ResourceSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResourceDetailView(APIView):
    """
    View to retrieve, update or delete a resource instance.
    Handles GET (retrieve), PUT/PATCH (update), and DELETE requests.
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser] # Needed for file updates

    def get_object(self, pk):
        """
        Helper method to get the resource object or raise a 404 error.
        """
        return get_object_or_404(Resource, pk=pk)

    def get(self, request, pk, format=None):
        """
        Retrieve a specific resource by its primary key (pk).
        """
        resource = self.get_object(pk)
        serializer = ResourceSerializer(resource, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk, format=None):
        """
        Update a resource completely.
        Requires all fields for the resource.
        """
        resource = self.get_object(pk)
        # Pass instance for update, data from request
        serializer = ResourceSerializer(resource, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk, format=None):
        """
        Partially update a resource.
        Only updates the fields provided in the request.
        """
        resource = self.get_object(pk)
        # Add partial=True for PATCH requests
        serializer = ResourceSerializer(resource, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, format=None):
        """
        Delete a resource.
        """
        resource = self.get_object(pk)
        resource.delete()
        # Return an empty response with No Content status
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResourceImageUploadView(APIView):
    """
    View dedicated to uploading images for a specific resource.
    Handles POST requests to associate a new image with a resource.
    """
    parser_classes = [MultiPartParser, FormParser] # Primarily for file uploads

    def post(self, request, resource_pk, format=None):
        """
        Upload an image and associate it with the resource identified by resource_pk.
        Expects 'image' and optional 'caption' in the multipart form data.
        """
        resource = get_object_or_404(Resource, pk=resource_pk)

        # Create a mutable copy of the request data to add the resource pk
        # image_data = request.data.copy()
        # image_data['resource'] = resource.pk # Associate with the resource

        # We need to pass the resource instance directly when creating the serializer instance
        # and ensure the 'image' file is in request.FILES
        if 'image' not in request.FILES:
             return Response({'image': 'Image file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Manually create the ResourceImage instance
        image_instance = ResourceImage(
            resource=resource,
            image=request.FILES['image'],
            caption=request.data.get('caption', '') # Get caption from form data
        )
        image_instance.save()

        # Serialize the created instance to return its data
        serializer = ResourceImageSerializer(image_instance, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# Optional: View to delete a specific image
class ResourceImageDetailView(APIView):
    """
    View to delete a specific image instance.
    Handles DELETE requests.
    """
    def get_object(self, pk):
         """ Helper method to get the image object or raise 404 """
         return get_object_or_404(ResourceImage, pk=pk)

    def delete(self, request, pk, format=None):
        """ Delete a specific image """
        image_instance = self.get_object(pk)
        # Optional: Check if the user has permission to delete this image
        # (e.g., if request.user owns the resource associated with the image)
        image_instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
