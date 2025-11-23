import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: {
                    "welcome_back": "Welcome back",
                    "sign_in_details": "Please enter your details to sign in.",
                    "email_address": "Email address",
                    "password": "Password",
                    "remember_me": "Remember me",
                    "forgot_password": "Forgot password?",
                    "sign_in": "Sign in",
                    "no_account": "Don't have an account?",
                    "register_now": "Register now",
                    "create_account": "Create Account",
                    "join_us": "Join us today.",
                    "first_name": "First Name",
                    "last_name": "Last Name",
                    "nif": "NIF",
                    "confirm_password": "Confirm Password",
                    "address": "Address",
                    "cancel": "Cancel",
                    "register": "Register",
                    "country": "Country",
                    "select_country": "Select a country",
                    "passwords_mismatch": "Passwords do not match",
                    "registration_success": "Registration successful! Please login.",
                    "registration_failed": "Registration failed",
                    "missing_fields": "Missing required fields",
                    "forgot_password_description": "Enter your email and we'll send you a link to reset your password.",
                    "enter_email": "Enter your email",
                    "send_reset_link": "Send Reset Link",
                    "sending": "Sending...",
                    "back_to_login": "Back to Login",
                    "check_your_email": "Check Your Email",
                    "reset_link_sent": "If an account with that email exists, a password reset link has been sent.",
                    "reset_password": "Reset Password",
                    "enter_new_password": "Enter your new password below.",
                    "new_password": "New Password",
                    "passwords_dont_match": "Passwords don't match",
                    "password_min_length": "Password must be at least 8 characters",
                    "resetting": "Resetting...",
                    "password_reset_success": "Password Reset Successful!",
                    "redirecting_to_login": "Redirecting to login..."
                }
            },
            es: {
                translation: {
                    "welcome_back": "Bienvenido de nuevo",
                    "sign_in_details": "Por favor ingresa tus datos para iniciar sesión.",
                    "email_address": "Correo electrónico",
                    "password": "Contraseña",
                    "remember_me": "Recuérdame",
                    "forgot_password": "¿Olvidaste tu contraseña?",
                    "sign_in": "Iniciar sesión",
                    "no_account": "¿No tienes una cuenta?",
                    "register_now": "Regístrate ahora",
                    "create_account": "Crear Cuenta",
                    "join_us": "Únete a nosotros hoy.",
                    "first_name": "Nombre",
                    "last_name": "Apellido",
                    "nif": "NIF",
                    "confirm_password": "Confirmar Contraseña",
                    "address": "Dirección",
                    "cancel": "Cancelar",
                    "register": "Registrarse",
                    "country": "País",
                    "select_country": "Selecciona un país",
                    "passwords_mismatch": "Las contraseñas no coinciden",
                    "registration_success": "¡Registro exitoso! Por favor inicia sesión.",
                    "registration_failed": "Registro fallido",
                    "missing_fields": "Faltan campos obligatorios",
                    "forgot_password_description": "Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.",
                    "enter_email": "Introduce tu correo",
                    "send_reset_link": "Enviar Enlace",
                    "sending": "Enviando...",
                    "back_to_login": "Volver al Login",
                    "check_your_email": "Revisa tu Correo",
                    "reset_link_sent": "Si existe una cuenta con ese correo, se ha enviado un enlace de restablecimiento.",
                    "reset_password": "Restablecer Contraseña",
                    "enter_new_password": "Introduce tu nueva contraseña.",
                    "new_password": "Nueva Contraseña",
                    "passwords_dont_match": "Las contraseñas no coinciden",
                    "password_min_length": "La contraseña debe tener al menos 8 caracteres",
                    "resetting": "Restableciendo...",
                    "password_reset_success": "¡Contraseña Restablecida!",
                    "redirecting_to_login": "Redirigiendo al login..."
                }
            }
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
