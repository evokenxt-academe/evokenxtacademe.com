FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Pass dummy variables ONLY for the build step so Next.js doesn't crash.
# These will NOT be baked into the final image environment for the end-user.
RUN DATABASE_URL="postgresql://dummy:dummy@dummy/dummy" \
    BETTER_AUTH_SECRET="dummy_secret" \
    BETTER_AUTH_URL="http://localhost:3000" \
    GOOGLE_CLIENT_ID="dummy_id" \
    GOOGLE_CLIENT_SECRET="dummy_secret" \
    NEXT_PUBLIC_ADMINS_EMAILS="dummy@example.com" \
    npm run build

CMD ["npm", "start"]

EXPOSE 3000
