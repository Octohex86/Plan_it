#!c:/programdata/anaconda3/python.exe
# -*- coding: utf-8 -*-
"""
Created on Mon Feb 26 14:36:45 2018

@author: DF
"""

#import requests
import os
import pandas as pd
import cgi
import cgitb
import sys
import codecs
import json

cgitb.enable()
sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
# Create instance of FieldStorage
form = cgi.FieldStorage()
# Get data from fields
first_name = form.getvalue('a')
#first_name='getData';
data_string='nothing happened';


if first_name=='getData':
    frame2=pd.read_excel('C:\Apache24\data\Data1.xlsx',sheetname='Jobs')#прочитать лист из файла excel по абсолютному пути
    job_obj=frame2.iloc[3];
    data_string=job_obj.to_json()

print("Content-type: text/html\n")
#print("""<!DOCTYPE HTML>
#        <html>
#        <head>
#            <meta charset="utf-8">
#            <title>Обработка данных форм</title>
#        </head>
#        <body>
#        """)

print(data_string);

#
#print("""</body>
#        </html>""")