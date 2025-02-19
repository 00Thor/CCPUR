FROM node

workdir /app

COPY package.json /app
RUN npm install

COPY . /app

EXPOSE  5000

CMD ["npm", "RUN", "DEV"]