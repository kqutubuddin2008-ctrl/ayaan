import logging
from flask import Flask, jsonify, render_template, request
from app.config import Config
from app.extensions import csrf, db, limiter, login_manager, migrate
from app.models import User

def create_app(config_object=Config):
    app=Flask(__name__); app.config.from_object(config_object)
    db.init_app(app); migrate.init_app(app,db); login_manager.init_app(app); csrf.init_app(app); limiter.init_app(app)
    logging.basicConfig(level=logging.INFO,format='%(asctime)s %(levelname)s %(name)s %(message)s')
    @login_manager.user_loader
    def load_user(user_id): return db.session.get(User,int(user_id))
    @login_manager.unauthorized_handler
    def unauthorized(): return jsonify(success=False,message='Authentication required',data={}),401 if request.path.startswith('/api/') else ('Sign in required',401)
    from app.routes.api import api
    app.register_blueprint(api)
    @app.get('/')
    def home(): return render_template('index.html')
    def error(status,message):
        if request.path.startswith('/api/'): return jsonify(success=False,message=message,data={}),status
        return render_template('error.html',status=status,message=message),status
    for status,msg in [(400,'Invalid request'),(403,'Permission denied'),(404,'Page not found'),(409,'Conflict'),(413,'Uploaded file is too large'),(422,'Validation failed'),(429,'Too many requests'),(500,'An unexpected error occurred')]:
        app.register_error_handler(status,lambda e,s=status,m=msg:error(s,m))
    return app
