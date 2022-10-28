FROM node
COPY . /app
WORKDIR /app
RUN npm install
ENTRYPOINT ["node", "index.js"]
EXPOSE "3000"