const request = require('supertest');
const server = require('../../api/app');
const db = require('../../data/db-config');

jest.mock('../../api/middleware/authRequired', () =>
  jest.fn((req, res, next) => next())
);
jest.mock('../../api/middleware/fileUpload', () =>
  jest.fn((req, res, next) => {
    req.body = {
      avatars: req.body,
    };
    next();
  })
);

const { avatars, badRequest } = require('../../data/testdata');

describe('avatar router endpoints', () => {
  beforeAll(async () => {
    await db.raw('TRUNCATE TABLE public."Avatars" RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await db.raw('TRUNCATE TABLE public."Avatars" RESTART IDENTITY CASCADE');
  });

  describe('POST /avatar', () => {
    it('should successfully add a single avatar to the table', async () => {
      const res = await request(server).post('/avatar').send(avatars[0]);

      expect(res.status).toBe(201);
      expect(res.body).toEqual([1]);
    });

    it('should successfully add two avatars to the database', async () => {
      const res = await request(server)
        .post('/avatar')
        .send(avatars.slice(1, 3));

      expect(res.status).toBe(201);
      expect(res.body).toEqual([2, 3]);
    });

    it('should return a 400 on poorly formatted avatar', async () => {
      const res = await request(server).post('/avatar').send(badRequest);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('InvalidAvatar');
    });

    it('should restrict the addition of redundant avatars', async () => {
      const res = await request(server)
        .post('/avatar')
        .send(avatars.slice(0, 1));

      expect(res.status).toBe(500);
      expect(res.body.message).toContain('unique');
    });
  });

  describe('GET /avatars', () => {
    it('should return the newly added avatar', async () => {
      const res = await request(server).get('/avatars');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
    });
  });
});