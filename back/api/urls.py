# backend/api/urls.py
from django.urls import path
from . import views

# Define URL patterns for the API views
urlpatterns = [
    # Endpoint for listing all resources and creating a new resource
    path('resources/', views.ResourceListCreateView.as_view(), name='resource-list-create'),

    # Endpoint for retrieving, updating (full/partial), and deleting a specific resource
    path('resources/<int:pk>/', views.ResourceDetailView.as_view(), name='resource-detail'),

    # Endpoint for uploading an image associated with a specific resource
    path('resources/<int:resource_pk>/images/', views.ResourceImageUploadView.as_view(), name='resource-image-upload'),

    # Endpoint for deleting a specific image by its own pk
    path('images/<int:pk>/', views.ResourceImageDetailView.as_view(), name='resource-image-detail'),
]
