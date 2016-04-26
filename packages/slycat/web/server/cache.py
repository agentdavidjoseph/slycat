# Copyright 2013, Sandia Corporation. Under the terms of Contract
# DE-AC04-94AL85000 with Sandia Corporation, the U.S. Government retains certain
# rights in this software.
import os
import hashlib
import cPickle
import time
import base64
import inspect

__all__ = ["CacheError"]

class CacheError(Exception):
  pass

class TimeError(CacheError):
  pass

class LifetimeError(CacheError):
  pass

class CachedObjectWrapper(object):
  """
  class used to wrap any object placed in the cache
  """
  def __init__(self, value, expiration=None):
    """
    creates a cached object with a cached items and an expiration
    :param value: item being wrapped
    :param expiration: time until the item is expire
    :return: not used
    """
    pass

class ServeCache(object):
  """
  class used to cache HQL and metadata queries
   usage example:
      server_cache = ServeCache()
      with server_cache.lock:
        apply: crud operation to
          server_cache.cache["artifact:aid:mid"]
            \
             server_cache.cache["artifact:aid:mid"]["artifact:data"]
             eg: server_cache.cache["artifact:aid:mid"]["metadata"], server_cache.cache["artifact:aid:mid"]["hql-result"]

   NOTE: a parse tree is also generated in order to speed up future unseen calls
  """
  __cache = {}
  __queue = Queue.Queue()
  __lock = threading.Lock()

  def __init__(self):
    pass
  @property
  def cache(self):
    """
    :return: dict() cache tree see class details
    """
    return self.__cache
  @cache.deleter
  def cache(self):
    """
    resets the cash to an empty dict {}
    :return:
    """
    self.__cache = {}
  @property
  def queue(self):
    """
    blocking queue that is read by the slycat.web.server.cleanup.py to force a cache cleanup
    by the cache cleanup thread.
    :return:
    """
    return self.__queue
  @property
  def lock(self):
    """
    threading.Lock() used to control crud operations to the cache.
    :return:
    """
    return self.__lock
  def clean(self):
    """
    Request a cleanup pass for the cache.
    """
    cherrypy.log.error("updating server cache force cleanup queue")
    self.__queue.put("cleanup")
server_cache = ServeCache()# instantiate our server cache for use here and in slycat.web.server.cleanup.py