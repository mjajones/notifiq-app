from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IncidentViewSet, UserViewSet, AssetViewSet, RegisterView, VerifyEmailView, StatusLabelViewSet, UserNoteViewSet

router = DefaultRouter()
router.register(r'incidents', IncidentViewSet, basename='incident')
router.register('status-labels', StatusLabelViewSet, basename='statuslabel')
router.register(r'users', UserViewSet, basename='user')
router.register(r'assets', AssetViewSet, basename='asset')
router.register(r'user-notes', UserNoteViewSet, basename='usernote')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('verify-email/<str:uidb64>/<str:token>/', VerifyEmailView.as_view(), name='verify_email'),
]